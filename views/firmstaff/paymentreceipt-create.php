<!-- Header Start -->
    <?php include('header.php'); ?>
<!-- Header End -->

<!-- Sidebar Start -->
    <?php include('sidebar.php'); ?>
<!-- Sidebar End -->

<!-- ========================
    Start Page Content
========================= -->
    
<div class="page-wrapper">

    <!-- Start Content -->
    <div class="content">

        <!-- row start -->
        <div class="row justify-content-center">
            <div class="col-lg-12">
                <!-- page header start -->
                <div class="mb-4">
                    <h5 class="fw-bold mb-0 d-flex align-items-center"> 
                        <a href="paymentreceipt-list.php" class="text-dark"> 
                            <i class="ti ti-chevron-left me-1"></i>Add Payment Receipt
                        </a>
                    </h5>
                </div>
                <!-- page header end -->

                <div class="card">
                    <div class="card-body">
                        <form action="#" method="POST" enctype="multipart/form-data">
                            <div class="row">

                                <div class="col-md-6 mb-3">
                                    <label for="client_name">Client Name</label>
                                    <input type="text" id="client_name" name="client_name" class="form-control" placeholder="Enter Client Name" required>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="invoice_number">Invoice #</label>
                                    <input type="text" id="invoice_number" name="invoice_number" class="form-control" placeholder="Enter Invoice Number" required>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="payment_mode">Payment Mode</label>
                                    <select id="payment_mode" name="payment_mode" class="form-control" required>
                                        <option value="">Select Payment Mode</option>
                                        <option>Cash</option>
                                        <option>Cheque</option>
                                        <option>Transfer</option>
                                    </select>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="amount">Amount</label>
                                    <input type="number" id="amount" name="amount" class="form-control" placeholder="Enter Amount" required>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="date">Date</label>
                                    <input type="date" id="date" name="date" class="form-control" required>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="receipt_file">Upload Receipt</label>
                                    <input type="file" id="receipt_file" name="receipt_file" class="form-control" required>
                                </div>

                                <div class="col-md-12 mb-3">
                                    <label for="remarks">Remarks</label>
                                    <textarea id="remarks" name="remarks" class="form-control" rows="3" placeholder="Enter Remarks" required></textarea>
                                </div>
                            </div>

                            <div class="d-flex align-items-center justify-content-end">
                                <a href="paymentreceipt-list.php" class="btn btn-light me-2">Cancel</a>
                                <button type="submit" name="submit" class="btn btn-primary btn-md fs-13 fw-medium rounded">Add Payment Receipt</button>
                            </div>

                        </form>
                    </div>
                </div>

            </div>
        </div>
        <!-- row end -->               
        
    </div>
    <!-- End Content -->

</div>

<!-- ========================
    End Page Content
========================= -->

<!-- Footer Start -->
    <?php include ('footer.php'); ?>
<!-- Footer End -->
